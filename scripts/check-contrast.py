"""Fail-closed WCAG AA check for the actual Developer Workspace tokens."""
import argparse
import pathlib
import re
import sys

FOREGROUNDS = ('ink', 'muted', 'faint', 'blue', 'green')
SURFACES = ('bg', 'panel', 'soft', 'active')
REQUIRED = {*FOREGROUNDS, *SURFACES, 'rule'}


def palette(css, selector):
    match = re.search(re.escape(selector) + r'\s*\{([^{}]*)\}', css)
    if not match:
        raise ValueError(f'missing palette block: {selector}')
    colors = dict(re.findall(r'--ws-([a-z-]+)\s*:\s*(#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?)\s*;', match.group(1)))
    missing = REQUIRED.difference(colors)
    if missing:
        raise ValueError(f'missing sRGB hex tokens in {selector}: {", ".join(sorted(missing))}')
    return {name: value.lower() for name, value in colors.items()}


def luminance(color):
    digits = color.removeprefix('#')
    if len(digits) == 3:
        digits = ''.join(channel * 2 for channel in digits)
    channels = [int(digits[offset:offset + 2], 16) / 255 for offset in (0, 2, 4)]
    linear = [value / 12.92 if value <= 0.04045 else ((value + 0.055) / 1.055) ** 2.4 for value in channels]
    return sum(value * weight for value, weight in zip(linear, (0.2126, 0.7152, 0.0722)))


def contrast(foreground, background):
    low, high = sorted((luminance(foreground), luminance(background)))
    return (high + 0.05) / (low + 0.05)


def check(css, verbose=False):
    light = palette(css, '.workspace-page')
    dark = palette(css, ':root.dark .workspace-page')
    system_dark = palette(css, ':root:not(.light) .workspace-page')
    if dark != system_dark:
        raise ValueError('system dark and explicit dark palettes differ')
    failures = []
    for label, colors in [('LIGHT', light), ('DARK', dark)]:
        results = [(contrast(colors[foreground], colors[surface]), foreground, surface)
                   for foreground in FOREGROUNDS for surface in SURFACES]
        for ratio, foreground, surface in results:
            if ratio < 4.5:
                failures.append(f'{label} {foreground}/{surface}: {ratio:.3f}:1 (requires 4.5:1)')
            if verbose:
                print(f'{label} {foreground}/{surface}: {ratio:.3f}:1')
        minimum, foreground, surface = min(results)
        print(f'{label}: 20 text/surface pairs; minimum {minimum:.3f}:1 ({foreground}/{surface}); all tokens in sRGB')
    if failures:
        for failure in failures:
            print(f'FAIL {failure}')
        return 1
    print('PASS: 40 WCAG AA pairs; system/explicit dark agree; no missing tokens.')
    return 0


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--css', type=pathlib.Path, default=pathlib.Path('src/styles/workspace.css'))
    parser.add_argument('--verbose', action='store_true')
    args = parser.parse_args()
    try:
        return check(args.css.read_text(), args.verbose)
    except (OSError, ValueError) as error:
        print(f'FAIL {error}')
        return 1


if __name__ == '__main__':
    sys.exit(main())

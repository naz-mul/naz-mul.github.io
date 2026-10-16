import pathlib
import subprocess
import tempfile
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]


def palette_css(*, faint='#526582', omit='', drift=False):
    light = {'bg': '#fbfcff', 'panel': '#ffffff', 'soft': '#f5f8fd', 'active': '#eaf2ff',
             'ink': '#0b1234', 'muted': '#536382', 'faint': faint, 'blue': '#005de7',
             'green': '#087c38', 'rule': '#e1e9f5'}
    dark = {'bg': '#0b1020', 'panel': '#101729', 'soft': '#151e34', 'active': '#172e50',
            'ink': '#eef3ff', 'muted': '#acbad4', 'faint': '#8fa2c2', 'blue': '#80b2ff',
            'green': '#6bd99a', 'rule': '#283550'}
    def block(selector, colors):
        return selector + ' {' + ''.join(f'--ws-{key}: {value};' for key, value in colors.items() if key != omit) + '}'
    system = {**dark, 'blue': '#ffffff'} if drift else dark
    return block('.workspace-page', light) + '@media (prefers-color-scheme: dark) {' + block(':root:not(.light) .workspace-page', system) + '}' + block(':root.dark .workspace-page', dark)


class ContrastBoundaryTests(unittest.TestCase):
    def run_checker(self, css):
        with tempfile.TemporaryDirectory() as folder:
            path = pathlib.Path(folder) / 'palette.css'
            path.write_text(css)
            return subprocess.run(['python3', str(ROOT / 'scripts/check-contrast.py'), '--css', str(path)], cwd=ROOT, capture_output=True, text=True)

    def test_missing_foreground_cannot_silently_pass(self):
        result = self.run_checker(palette_css(omit='faint'))
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('missing', result.stdout.lower())

    def test_low_contrast_in_actual_workspace_palette_fails(self):
        result = self.run_checker(palette_css(faint='#aabbee'))
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('fail', result.stdout.lower())

    def test_system_and_explicit_dark_must_stay_equal(self):
        result = self.run_checker(palette_css(drift=True))
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('dark', result.stdout.lower())

    def test_both_eligible_palettes_pass(self):
        result = self.run_checker(palette_css())
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)


if __name__ == '__main__':
    unittest.main()

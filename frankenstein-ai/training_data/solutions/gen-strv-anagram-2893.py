# Task: gen-strv-anagram-2893 | Score: 100% | 2026-02-14T12:59:48.427655

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')
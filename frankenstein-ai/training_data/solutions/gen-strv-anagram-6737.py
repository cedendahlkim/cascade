# Task: gen-strv-anagram-6737 | Score: 100% | 2026-02-13T20:33:10.535087

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')
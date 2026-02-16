# Task: gen-strv-anagram-8428 | Score: 100% | 2026-02-13T20:50:34.965718

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')
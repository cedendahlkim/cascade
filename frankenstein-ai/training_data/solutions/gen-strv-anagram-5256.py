# Task: gen-strv-anagram-5256 | Score: 100% | 2026-02-13T10:13:34.336865

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')
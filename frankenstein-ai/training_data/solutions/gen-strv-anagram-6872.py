# Task: gen-strv-anagram-6872 | Score: 100% | 2026-02-13T21:08:25.855655

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')
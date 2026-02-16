# Task: gen-strv-anagram-6830 | Score: 100% | 2026-02-14T12:05:21.520522

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')
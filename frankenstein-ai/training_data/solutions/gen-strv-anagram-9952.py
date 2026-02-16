# Task: gen-strv-anagram-9952 | Score: 100% | 2026-02-15T07:46:50.204522

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')
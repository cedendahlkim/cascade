# Task: gen-strv-anagram-3684 | Score: 100% | 2026-02-15T08:14:38.217856

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')
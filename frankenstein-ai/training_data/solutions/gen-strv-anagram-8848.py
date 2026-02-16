# Task: gen-strv-anagram-8848 | Score: 100% | 2026-02-15T08:06:36.732464

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')
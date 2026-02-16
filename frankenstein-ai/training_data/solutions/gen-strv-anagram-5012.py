# Task: gen-strv-anagram-5012 | Score: 100% | 2026-02-15T13:01:09.832391

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')
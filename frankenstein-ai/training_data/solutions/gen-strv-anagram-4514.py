# Task: gen-strv-anagram-4514 | Score: 100% | 2026-02-14T13:25:53.592355

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')
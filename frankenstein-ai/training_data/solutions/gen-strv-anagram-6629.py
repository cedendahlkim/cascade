# Task: gen-strv-anagram-6629 | Score: 100% | 2026-02-17T20:31:05.695655

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')
# Task: gen-strv-anagram-8907 | Score: 100% | 2026-02-14T12:48:45.225139

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')
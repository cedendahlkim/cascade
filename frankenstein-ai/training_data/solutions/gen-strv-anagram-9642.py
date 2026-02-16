# Task: gen-strv-anagram-9642 | Score: 100% | 2026-02-13T12:17:44.962908

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')
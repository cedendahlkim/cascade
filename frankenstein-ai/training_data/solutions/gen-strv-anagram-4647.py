# Task: gen-strv-anagram-4647 | Score: 100% | 2026-02-13T18:20:20.993739

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')
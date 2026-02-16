# Task: gen-strv-anagram-6112 | Score: 100% | 2026-02-13T18:57:46.708446

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')
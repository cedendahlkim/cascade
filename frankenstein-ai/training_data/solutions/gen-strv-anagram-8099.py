# Task: gen-strv-anagram-8099 | Score: 100% | 2026-02-13T18:45:52.653637

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')
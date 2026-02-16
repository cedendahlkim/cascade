# Task: gen-strv-anagram-4056 | Score: 100% | 2026-02-13T20:02:33.362839

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')
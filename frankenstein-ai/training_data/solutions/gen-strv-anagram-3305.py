# Task: gen-strv-anagram-3305 | Score: 100% | 2026-02-13T13:21:54.515055

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')
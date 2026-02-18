# Task: gen-strv-anagram-9653 | Score: 100% | 2026-02-17T20:14:14.999012

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')
# Task: gen-numtheory-digit_sum-2645 | Score: 100% | 2026-02-13T20:32:57.637636

n = int(input())
print(sum(int(d) for d in str(abs(n))))
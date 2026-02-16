# Task: gen-numtheory-digit_sum-3308 | Score: 100% | 2026-02-13T18:29:57.121091

n = int(input())
print(sum(int(d) for d in str(abs(n))))
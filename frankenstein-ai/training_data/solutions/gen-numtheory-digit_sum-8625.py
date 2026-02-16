# Task: gen-numtheory-digit_sum-8625 | Score: 100% | 2026-02-13T17:11:39.482443

n = int(input())
print(sum(int(d) for d in str(abs(n))))
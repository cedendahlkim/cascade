# Task: gen-numtheory-digit_sum-2088 | Score: 100% | 2026-02-13T18:36:07.572935

n = int(input())
print(sum(int(d) for d in str(abs(n))))
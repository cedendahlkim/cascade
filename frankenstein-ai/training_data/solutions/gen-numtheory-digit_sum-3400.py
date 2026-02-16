# Task: gen-numtheory-digit_sum-3400 | Score: 100% | 2026-02-13T18:58:09.668167

n = int(input())
print(sum(int(d) for d in str(abs(n))))
# Task: gen-numtheory-digit_sum-1218 | Score: 100% | 2026-02-13T11:53:57.205061

n = int(input())
print(sum(int(d) for d in str(abs(n))))
# Task: gen-rec-sum_digits-9969 | Score: 100% | 2026-02-13T16:06:47.866815

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)
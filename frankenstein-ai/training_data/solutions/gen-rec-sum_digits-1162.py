# Task: gen-rec-sum_digits-1162 | Score: 100% | 2026-02-13T10:03:02.676769

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)
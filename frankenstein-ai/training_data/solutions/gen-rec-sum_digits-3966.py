# Task: gen-rec-sum_digits-3966 | Score: 100% | 2026-02-15T10:10:09.767278

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)
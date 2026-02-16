# Task: gen-rec-sum_digits-4553 | Score: 100% | 2026-02-15T09:17:01.222854

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)
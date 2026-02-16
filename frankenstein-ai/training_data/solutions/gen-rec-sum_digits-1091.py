# Task: gen-rec-sum_digits-1091 | Score: 100% | 2026-02-14T12:03:07.688252

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)
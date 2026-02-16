# Task: gen-rec-sum_digits-9892 | Score: 100% | 2026-02-15T08:49:19.109854

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)
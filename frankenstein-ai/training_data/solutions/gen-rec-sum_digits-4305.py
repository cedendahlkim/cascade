# Task: gen-rec-sum_digits-4305 | Score: 100% | 2026-02-15T13:59:58.471245

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)
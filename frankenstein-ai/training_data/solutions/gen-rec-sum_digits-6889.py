# Task: gen-rec-sum_digits-6889 | Score: 100% | 2026-02-15T09:02:15.196843

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)
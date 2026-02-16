# Task: gen-rec-sum_digits-7834 | Score: 100% | 2026-02-14T12:20:04.832616

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)
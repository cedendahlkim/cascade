# Task: gen-rec-sum_digits-9993 | Score: 100% | 2026-02-15T10:28:55.352039

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)
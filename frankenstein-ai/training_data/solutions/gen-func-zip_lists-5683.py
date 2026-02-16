# Task: gen-func-zip_lists-5683 | Score: 100% | 2026-02-10T15:44:58.737890

n = int(input())
a = []
for _ in range(n):
    a.append(int(input()))
b = []
for _ in range(n):
    b.append(int(input()))

result = ""
for i in range(n):
    result += str(a[i]) + "," + str(b[i]) + " "

print(result.strip())
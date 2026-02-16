# Task: gen-func-zip_lists-4816 | Score: 100% | 2026-02-12T12:01:59.739353

n = int(input())
list_a = []
list_b = []
for _ in range(n):
    list_a.append(int(input()))
for _ in range(n):
    list_b.append(int(input()))

result = ""
for i in range(n):
    result += str(list_a[i]) + "," + str(list_b[i]) + " "

print(result.strip())
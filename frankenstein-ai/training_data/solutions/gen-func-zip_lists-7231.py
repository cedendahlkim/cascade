# Task: gen-func-zip_lists-7231 | Score: 100% | 2026-02-10T15:44:50.766121

n = int(input())
list_a = []
for _ in range(n):
    list_a.append(int(input()))
list_b = []
for _ in range(n):
    list_b.append(int(input()))

result = ""
for i in range(n):
    result += str(list_a[i]) + "," + str(list_b[i])
    if i < n - 1:
        result += " "

print(result)
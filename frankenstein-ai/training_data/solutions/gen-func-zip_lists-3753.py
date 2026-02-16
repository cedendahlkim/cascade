# Task: gen-func-zip_lists-3753 | Score: 100% | 2026-02-12T18:43:04.462475

n = int(input())
a = []
b = []
for _ in range(n):
    a.append(int(input()))
for _ in range(n):
    b.append(int(input()))

result = ""
for i in range(n):
    result += str(a[i]) + "," + str(b[i]) + " "

print(result.strip())
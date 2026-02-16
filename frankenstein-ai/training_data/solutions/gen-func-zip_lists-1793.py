# Task: gen-func-zip_lists-1793 | Score: 100% | 2026-02-12T20:50:16.107564

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
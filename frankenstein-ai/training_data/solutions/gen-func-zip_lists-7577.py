# Task: gen-func-zip_lists-7577 | Score: 100% | 2026-02-10T19:21:38.946644

N = int(input())
A = []
for _ in range(N):
  A.append(int(input()))
B = []
for _ in range(N):
  B.append(int(input()))

result = ""
for i in range(N):
  result += str(A[i]) + "," + str(B[i]) + " "

print(result.strip())
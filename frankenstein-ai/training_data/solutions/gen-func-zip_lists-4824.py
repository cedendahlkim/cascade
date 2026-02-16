# Task: gen-func-zip_lists-4824 | Score: 100% | 2026-02-12T19:39:34.306772

N = int(input())
A = []
B = []
for _ in range(N):
    A.append(int(input()))
for _ in range(N):
    B.append(int(input()))

result = ""
for i in range(N):
    result += str(A[i]) + "," + str(B[i]) + " "

print(result.strip())
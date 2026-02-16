# Task: gen-func-zip_lists-1173 | Score: 100% | 2026-02-13T08:55:51.899593

def solve():
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

solve()
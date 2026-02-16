# Task: gen-sw-max_sum_k-1701 | Score: 100% | 2026-02-13T18:45:21.208906

def solve():
    n, k = map(int, input().split())
    arr = list(map(int, input().split()))

    max_sum = float('-inf')
    current_sum = 0

    for i in range(k):
        current_sum += arr[i]

    max_sum = current_sum

    for i in range(k, n):
        current_sum += arr[i] - arr[i - k]
        max_sum = max(max_sum, current_sum)

    print(max_sum)

solve()
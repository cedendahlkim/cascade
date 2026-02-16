# Task: gen-comb-combinations-5413 | Score: 100% | 2026-02-11T08:50:00.291636

def combinations(arr, k):
    if k == 0:
        return [[]]
    if not arr:
        return []

    first = arr[0]
    rest = arr[1:]

    without_first = combinations(rest, k)
    with_first = [[first] + comb for comb in combinations(rest, k - 1)]

    return with_first + without_first

n = int(input())
arr = []
for _ in range(n):
    arr.append(int(input()))
k = int(input())

result = combinations(arr, k)
result.sort()

for comb in result:
    print(*comb)
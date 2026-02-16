# Task: gen-comb-combinations-3826 | Score: 100% | 2026-02-11T10:30:24.740196

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

def main():
    n = int(input())
    arr = []
    for _ in range(n):
        arr.append(int(input()))
    k = int(input())

    combs = combinations(arr, k)
    combs.sort()
    for comb in combs:
        print(*comb)

if __name__ == "__main__":
    main()
# Task: gen-comb-combinations-5995 | Score: 100% | 2026-02-11T09:29:40.815885

def combinations(arr, k):
    result = []
    def backtrack(start, comb):
        if len(comb) == k:
            result.append(comb[:])
            return
        for i in range(start, len(arr)):
            comb.append(arr[i])
            backtrack(i + 1, comb)
            comb.pop()
    backtrack(0, [])
    return result

if __name__ == "__main__":
    n = int(input())
    arr = []
    for _ in range(n):
        arr.append(int(input()))
    k = int(input())
    
    combs = combinations(arr, k)
    for comb in combs:
        print(*comb)
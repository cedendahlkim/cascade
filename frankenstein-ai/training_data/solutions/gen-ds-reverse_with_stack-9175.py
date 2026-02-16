# Task: gen-ds-reverse_with_stack-9175 | Score: 100% | 2026-02-14T12:13:39.045556

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
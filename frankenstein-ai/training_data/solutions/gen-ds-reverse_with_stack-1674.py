# Task: gen-ds-reverse_with_stack-1674 | Score: 100% | 2026-02-14T12:09:05.031703

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
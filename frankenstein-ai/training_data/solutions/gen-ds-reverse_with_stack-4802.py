# Task: gen-ds-reverse_with_stack-4802 | Score: 100% | 2026-02-13T14:09:58.154631

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))
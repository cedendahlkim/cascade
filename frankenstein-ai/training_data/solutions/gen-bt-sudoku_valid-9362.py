# Task: gen-bt-sudoku_valid-9362 | Score: 100% | 2026-02-11T12:23:22.926334

def solve_sudoku():
    grid = []
    for _ in range(9):
        grid.append(list(map(int, input().split())))

    def is_valid(board, row, col, num):
        for i in range(9):
            if board[row][i] == num:
                return False
            if board[i][col] == num:
                return False
            if board[3 * (row // 3) + i // 3][3 * (col // 3) + i % 3] == num:
                return False
        return True

    def find_empty(board):
        for i in range(9):
            for j in range(9):
                if board[i][j] == 0:
                    return (i, j)
        return None

    def sudoku_solver(board):
        find = find_empty(board)
        if not find:
            return True
        else:
            row, col = find

        for i in range(1, 10):
            if is_valid(board, row, col, i):
                board[row][col] = i

                if sudoku_solver(board):
                    return True

                board[row][col] = 0

        return False

    if sudoku_solver(grid):
        print("valid")
    else:
        
        rows_valid = True
        for row in grid:
            seen = set()
            for num in row:
                if num != 0:
                    if num in seen:
                        rows_valid = False
                        break
                    seen.add(num)
            if not rows_valid:
                break
        
        cols_valid = True
        for col in range(9):
            seen = set()
            for row in range(9):
                num = grid[row][col]
                if num != 0:
                    if num in seen:
                        cols_valid = False
                        break
                    seen.add(num)
            if not cols_valid:
                break

        boxes_valid = True
        for box_row in range(3):
            for box_col in range(3):
                seen = set()
                for i in range(3):
                    for j in range(3):
                        num = grid[box_row * 3 + i][box_col * 3 + j]
                        if num != 0:
                            if num in seen:
                                boxes_valid = False
                                break
                            seen.add(num)
                    if not boxes_valid:
                        break
                if not boxes_valid:
                    break
            if not boxes_valid:
                break

        if rows_valid and cols_valid and boxes_valid:
            print("valid")
        else:
            print("invalid")

solve_sudoku()